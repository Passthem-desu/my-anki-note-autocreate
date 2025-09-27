#!/bin/bash

set -e

# 镜像名称
IMAGE_NAME="gitea.service.jazzwhom.top/kagami-ci/pt-add-word"

# 获取当前 Git 提交的短哈希（用于版本标签）
if command -v git &> /dev/null; then
    GIT_COMMIT=$(git rev-parse --short HEAD)
    GIT_TAG="git-${GIT_COMMIT}"
else
    GIT_TAG="latest"
    echo "Warning: git not found, using 'latest' tag"
fi

# 构建镜像
echo "Building Podman image: ${IMAGE_NAME}:${GIT_TAG}"
podman build -t "${IMAGE_NAME}:${GIT_TAG}" .

# 同时打上 latest 标签
podman tag "${IMAGE_NAME}:${GIT_TAG}" "${IMAGE_NAME}:latest"

echo "Image built successfully!"

# 推送镜像
echo "Pushing image to registry..."
podman push "${IMAGE_NAME}:${GIT_TAG}"
podman push "${IMAGE_NAME}:latest"

echo "Image pushed successfully!"
echo "Image URL: ${IMAGE_NAME}:${GIT_TAG}"