# Stage 1: Build Angular app
FROM node:20 AS build-stage

# GitLab CI のプロキシ変数を受け取る
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV http_proxy=${http_proxy} \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy}


# Build arguments
ARG BUILD_TARGET=dev
ARG ENCODE_CONTEXT_PATH=j0503015/ui/001
ARG BASE_HREF=/

ARG CACHE_BREAKER=1
RUN echo $CACHE_BREAKER

WORKDIR /app

#COPY package*.json ./
#COPY angular-test/package.json ./
#COPY angular-test/package-lock.json ./
#COPY angular-test/angular.json ./
#COPY angular-test/tsconfig*.json ./
#COPY angular-test/src/ ./src
COPY react-app/ ./


#以前のdistを削除して再ビルド
#RUN rm -rf dist && npm ci
RUN npm install
RUN npm run build:${BUILD_TARGET} --base-href=/${ENCODE_CONTEXT_PATH}/
# Angularビルド後の成果物確認
RUN test -f /app/dist/index.html
RUN ls -lR /app/dist


# Stage 2: Serve app with nginx
FROM nginx:stable-alpine AS production-stage

# Proxy settings for corporate network
#ENV http_proxy=http://10.76.226.10:3128
#ENV https_proxy=http://10.76.226.10:3128
#ENV no_proxy=169.254.169.254

ARG APP_ROOT_PATH=j0503015/ui/001

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*



# Copy Angular build output
COPY --from=build-stage /app/dist/ /usr/share/nginx/html/${APP_ROOT_PATH}/

# コピー後の状態確認
RUN test -f /usr/share/nginx/html/${APP_ROOT_PATH}/index.html
RUN ls -lR /usr/share/nginx/html/${APP_ROOT_PATH}/



# Copy nginx configuration
COPY ./default.conf /etc/nginx/conf.d/default.conf

# Create log directory and link logs
# nginx:stable-alpineのイメージでは/var/log/nginx/access.logが無いらしい
# nginx:stableか、nginx:latestならログが出るらしい
#RUN mkdir -p /release/logs/ui
#RUN touch /release/logs/ui/access.log /release/logs/ui/error.log
#RUN ln -sf /release/logs/ui/access.log /var/log/nginx/access.log
#RUN ln -sf /release/logs/ui/error.log /var/log/nginx/error.log

#ログの出力をdefault.confで指定。dockerfileではファイル作成のみ
#RUN mkdir -p /release/logs/ui \
#    && touch /release/logs/ui/access.log /release/logs/ui/error.log



# Replace placeholder in nginx config
# RUN sed -i "s:__APP_ROOT_PATH__:$APP_ROOT_PATH:g" /etc/nginx/conf.d/default.conf

# 変更後の default.conf を出力
# RUN echo "===== /etc/nginx/conf.d/default.conf =====" \
#     && cat /etc/nginx/conf.d/default.conf


EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

