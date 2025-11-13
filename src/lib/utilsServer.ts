import { json, type RequestHandler } from "@sveltejs/kit";
import { type RpcResponse } from "./utils";

type ServerService<T> = { [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? T[K] : never };

/**
 * createServer: 通用 RPC 服务端生成器。
 * 接受一个服务对象，返回一个 SvelteKit POST RequestHandler。
 *
 * @param serviceObject 实现了服务方法的对象实例 (如 new ServerAnkiAPI())
 * @returns SvelteKit POST RequestHandler
 */
export function createRpcServer<T extends ServerService<any>>(serviceObject: T): RequestHandler {
    const service = serviceObject;

    // 返回 SvelteKit 的 RequestHandler
    return async ({ request, params }) => {
        // 1. 获取 Action（方法名）
        const action = params.action as keyof T;

        // 2. 检查 Action 是否存在且为函数
        if (!action || typeof service[action] !== 'function') {
            const error: RpcResponse = {
                result: null,
                error: `Action '${String(action)}' not found or is not a callable method.`
            };
            // 使用 404 状态码表示方法不存在
            return json(error, { status: 404 });
        }

        let args: any[];
        try {
            // 3. 解析请求体，获取参数数组
            args = await request.json() as any[];
            if (!Array.isArray(args)) {
                 // 强制要求参数必须是数组，即使只有一个参数
                args = [];
            }
        } catch (e) {
            const error: RpcResponse = {
                result: null,
                error: `Invalid JSON body. Parameters must be sent as a JSON array.`
            };
            return json(error, { status: 400 }); // 400 Bad Request
        }

        try {
            // 4. 调用服务方法
            // 使用 Reflect.apply 确保正确的 this 上下文
            const serviceResult: any = await Reflect.apply(service[action], serviceObject, args);

            // 5. 封装并返回成功结果
            const response: RpcResponse = {
                result: serviceResult, // 通用数据类型 any
                error: null
            };
            return json(response, { status: 200 });

        } catch (e: any) {
            // 6. 捕获服务方法执行中的错误
            console.error(`Error executing action ${String(action)}:`, e);
            const errorResponse: RpcResponse = {
                result: null,
                error: e.message || 'Internal server error during method execution.'
            };
            return json(errorResponse, { status: 500 }); // 500 Internal Server Error
        }
    };
}
