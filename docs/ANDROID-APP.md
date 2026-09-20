# BNBFISH Android APP 封装

本项目已加入 Capacitor Android 封装，网页资源从 `web/` 打包到应用内，适合手机全屏竖屏使用。

## 构建

需要 Node.js、Java 17、Android SDK 和 Android Build Tools：

```bash
pnpm install
pnpm run app:sync
cd android
gradlew.bat assembleDebug       # Windows
./gradlew assembleDebug         # macOS / Linux
```

APK 输出在 `android/app/build/outputs/apk/debug/app-debug.apk`。Android Studio 也可以直接打开 `android/` 工程并运行。

## 应用配置

- 应用 ID：`trade.bnbfish.app`
- 只允许竖屏，启动时隐藏系统状态栏，适配手机全屏画面。
- 网页资源随 APK 一起打包；不包含私钥、助记词、服务器密码或运营密钥。
- BNB 链 RPC、合约和只读接口使用网页中的公开配置；交易必须由用户钱包签名。
- `bnbfish.trade` 是允许导航域名，用于钱包提供商和公开只读接口。

调试 APK 仅用于内部体验。正式发布前请配置独立的 release keystore、版本号、隐私政策和商店素材，不要提交 keystore 或任何钱包密钥。
