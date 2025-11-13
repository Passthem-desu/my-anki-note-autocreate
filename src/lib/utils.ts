// 标准的 RPC 响应结构
export type RpcResponse = {
    result: any;
    error: string | null;
};

/**
 * 等待指定毫秒数。
 * @param ms 等待的毫秒数。
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试一个异步函数，直到它不再抛出异常，或达到最大尝试次数。
 *
 * @template T 异步函数返回值的类型。
 * @param fn 要执行的异步函数。
 * @param maxAttempts 最大尝试次数（包括第一次尝试），必须大于 0。
 * @param delayMs 每次重试之间等待的毫秒数。
 * @returns 异步函数成功执行后的返回值。
 * @throws 如果达到最大尝试次数，仍抛出异常，则抛出最后一次的异常。
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  if (maxAttempts <= 0) {
    throw new Error("maxAttempts 必须大于 0");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 尝试执行异步函数
      const result = await fn();
      // 成功，返回结果
      return result;
    } catch (error) {
      // 记录异常
      lastError = error;

      // 如果还没有达到最大尝试次数，则等待并准备下一次重试
      if (attempt < maxAttempts) {
        console.warn(`第 ${attempt} 次尝试失败，将在 ${delayMs}ms 后重试... 错误:`, error);
        await sleep(delayMs);
      } else {
        // 达到最大尝试次数，跳出循环
        break;
      }
    }
  }

  // 达到最大尝试次数仍失败，抛出最后一次的异常
  console.error(`异步函数重试失败，已达到最大尝试次数 ${maxAttempts}。`);
  throw lastError;
}

/**
 * 基于 Proxy 机制，根据一个接口（Interface）自动生成一个 RPC 客户端对象。
 * 对象上的方法名会被用作 callServerAPI 的 action 参数。
 *
 * @param callServerAPI 实际执行网络请求的核心函数
 * @returns 实现了 T 接口的对象
 */
export function createClient<T extends { [K in keyof T]: T[K] extends Function ? T[K] : never }>(
  callServerAPI: (action: string, params: any[]) => Promise<any>
): T {
  // 使用 Proxy 拦截对对象属性（方法名）的访问
  return new Proxy({} as T, {
    get(target, propKey) {
      if (typeof propKey === 'string') {
        const action = propKey; // 方法名即为 API action 名称

        // 返回一个异步函数，该函数接收所有参数，并调用 callServerAPI
        return async function (...params: any[]): Promise<any> {
          // 这里的类型检查和参数传递完全由 TypeScript 的 interface T 保证
          const result = await callServerAPI(action, params);

          // 注意：我们直接返回了 callServerAPI 的结果。
          // 假设 callServerAPI 的实现确保了其返回类型与 T 中方法定义的 Promise 解析类型一致。
          return result;
        };
      }
      return Reflect.get(target, propKey);
    }
  });
}

/**
 * createRPCClient: RPC 客户端生成器。
 * 接收基路径，返回一个实现了 T 接口的客户端实例。
 * 客户端的所有方法都将通过网络请求转发到服务器。
 *
 * @param baseURL API 的基路径，例如 '/api/anki'
 * @returns 实现了 T 接口的客户端对象
 */
export function createRPCClient<T extends { [K in keyof T]: T[K] extends Function ? T[K] : never }>(baseURL: string): T {
  /**
   * RPC 客户端的核心通信函数。
   * 负责将方法名和参数序列化为网络请求。
   */
  async function callServerAPI(action: string, params: any[]): Promise<any> {
    // 1. 构造目标 URL： /api/anki/[action]
    const url = `${baseURL}/${action}`;

    // 2. 发送 POST 请求，Body 是参数数组
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    // 3. 检查 HTTP 状态码
    if (!response.ok) {
      // 如果 HTTP 状态码不是 2xx，服务器处理出现了问题 (如 404, 500)
      let errorText = `Network/Server Error: ${response.status} ${response.statusText}`;
      try {
        // 尝试解析响应体，看是否有我们后端定义的 RpcResponse 结构
        const errorBody: RpcResponse = await response.json();
        if (errorBody && errorBody.error) {
          errorText = errorBody.error; // 使用后端的错误信息
        }
      } catch (e) {
        // 忽略解析错误，使用默认的 HTTP 错误信息
      }
      throw new Error(`[RPC Error: ${action}] ${errorText}`);
    }

    // 4. 解析响应体
    const data: RpcResponse = await response.json();

    // 5. 检查 RPC 响应体中的 error 字段
    if (data.error !== null) {
      throw new Error(`[Server RPC Error: ${action}] ${data.error}`);
    }

    // 6. 返回结果 (对应您 ServerAnkiAPI 方法的实际返回值)
    return data.result;
  }

  // 将底层通信函数传递给 createClient
  return createClient<T>(callServerAPI);
}
