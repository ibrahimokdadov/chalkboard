const { execFileSync } = require("child_process");

function reg(args) {
  execFileSync("reg.exe", args, { stdio: "inherit" });
}

for (const key of [
  "HKCU\\Software\\Classes\\*\\shell\\LoomarkRead",
  "HKCU\\Software\\Classes\\Directory\\shell\\LoomarkRead",
  "HKCU\\Software\\Classes\\*\\shell\\ContextLibrarianRead",
  "HKCU\\Software\\Classes\\Directory\\shell\\ContextLibrarianRead",
]) {
  try {
    reg(["delete", key, "/f"]);
  } catch {
    // Missing keys are fine.
  }
}

console.log("Loomark Explorer menu removed for the current user.");
