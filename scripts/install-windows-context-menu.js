const { execFileSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const electronExe = path.join(root, "node_modules", "electron", "dist", "electron.exe");
const command = `"${electronExe}" "${root}" --context "%1"`;
const folderCommand = `"${electronExe}" "${root}" --context "%V"`;

function reg(args) {
  execFileSync("reg.exe", args, { stdio: "inherit" });
}

function addKey(key, name, value) {
  reg(["add", key, "/v", name, "/t", "REG_SZ", "/d", value, "/f"]);
}

function addDefault(key, value) {
  reg(["add", key, "/ve", "/t", "REG_SZ", "/d", value, "/f"]);
}

const fileKey = "HKCU\\Software\\Classes\\*\\shell\\LoomarkRead";
const fileCommandKey = `${fileKey}\\command`;
const folderKey = "HKCU\\Software\\Classes\\Directory\\shell\\LoomarkRead";
const folderCommandKey = `${folderKey}\\command`;

addKey(fileKey, "MUIVerb", "Read context with Loomark");
addKey(fileKey, "Icon", electronExe);
addDefault(fileCommandKey, command);

addKey(folderKey, "MUIVerb", "Read context with Loomark");
addKey(folderKey, "Icon", electronExe);
addDefault(folderCommandKey, folderCommand);

for (const staleKey of [
  "HKCU\\Software\\Classes\\*\\shell\\ContextLibrarianRead",
  "HKCU\\Software\\Classes\\Directory\\shell\\ContextLibrarianRead",
]) {
  try {
    reg(["delete", staleKey, "/f"]);
  } catch {
    // Missing old keys are fine.
  }
}

console.log("Loomark Explorer menu installed for the current user.");
console.log("On Windows 11, check the classic menu via: Right click > Show more options.");
