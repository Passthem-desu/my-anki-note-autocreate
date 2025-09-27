#!/usr/bin/env pwsh

# 镜像名称
$IMAGE_NAME = "gitea.service.jazzwhom.top/kagami-ci/pt-add-word"

# 获取当前 Git 提交的短哈希（用于版本标签）
if (Get-Command git -ErrorAction SilentlyContinue) {
    $GIT_COMMIT = git rev-parse --short HEAD
    $GIT_TAG = "git-$GIT_COMMIT"
} else {
    $GIT_TAG = "latest"
    Write-Host "Warning: git not found, using 'latest' tag"
}

# 构建镜像
Write-Host "Building Podman image: $IMAGE_NAME`:$GIT_TAG"
podman build -t "$IMAGE_NAME`:$GIT_TAG" .

# 同时打上 latest 标签
podman tag "$IMAGE_NAME`:$GIT_TAG" "$IMAGE_NAME`:latest"

Write-Host "Image built successfully!"

# 推送镜像
Write-Host "Pushing image to registry..."
podman push "$IMAGE_NAME`:$GIT_TAG"
podman push "$IMAGE_NAME`:latest"

Write-Host "Image pushed successfully!"
Write-Host "Image URL: $IMAGE_NAME`:$GIT_TAG"