import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);

const main = async (command: string, components: string[]) => {
  switch (command) {
    // 生成数据库迁移文件
    case "add": {
      if (components.length === 0) {
        console.error("❌ 请输入要添加的组件名称");
        return;
      }

      console.log("🚀 正在添加新shadcn组件.......");
      try {
        execSync(`pnpx shadcn@latest add ${components.join(" ")}`, {
          stdio: "inherit",
        });
        console.log("✅ 添加成功");
      } catch (e) {
        console.error("❌ 添加失败", e);
      }
      break;
    }

    default: {
      console.error("❌❌ 未知命令 ❌❌");
    }
  }
};

if (process.argv[1] === __filename) {
  const command = process.argv[2];
  const components = process.argv.slice(3);
  main(command, components);
}
