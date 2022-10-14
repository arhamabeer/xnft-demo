const fs = require("fs");
const path = require("path");

const dir = {
  "cipher-base/package.json": "cipher-base/package.json",
  "@toruslabs/package.json": "@toruslabs/eccrypto/package.json",
  "@toruslabs/index.js": "@toruslabs/eccrypto/index.js",
  "@jnwng/walletconnect-solana/package.json":
    "@jnwng/walletconnect-solana/package.json",
};

Object.entries(dir).map(([file, dest]) => {
  fs.copyFileSync(
    path.resolve(__dirname, "patches", file),
    path.resolve(__dirname, "..", "node_modules", dest)
  );
});
