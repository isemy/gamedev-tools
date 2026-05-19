import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    href: "/tools/color",
    icon: "🎨",
    title: "调色板生成器",
    description: "输入主色，自动生成互补色、三角配色和游戏 UI 推荐配色方案，支持导出 CSS 变量。",
    tag: "配色",
  },
  {
    href: "/tools/sfx",
    icon: "🔊",
    title: "音效生成器",
    description: "程序化生成跳跃、爆炸、拾取等游戏音效，实时预览，导出 WAV 文件。",
    tag: "音频",
  },
  {
    href: "/tools/random",
    icon: "🎲",
    title: "随机内容生成器",
    description: "生成 NPC 名字、物品描述、任务文本，支持中文古风、西幻、赛博朋克等风格。",
    tag: "内容生成",
  },
  {
    href: "/tools/math",
    icon: "📊",
    title: "游戏数值计算器",
    description: "缓动函数可视化、伤害公式批量模拟、掉落率概率分布，帮你调出平衡的数值。",
    tag: "数值",
  },
  {
    href: "/tools/gdd",
    icon: "📄",
    title: "GDD 文档生成器",
    description: "填写基本信息，自动生成结构化的游戏设计文档，支持在线编辑和导出 Markdown。",
    tag: "文档",
  },
  {
    href: "/tools/pathfinding",
    icon: "🗺️",
    title: "A* 寻路可视化",
    description: "绘制障碍物，设置起点和终点，实时观察 A* 算法的搜索过程与最短路径。",
    tag: "算法",
  },
  {
    href: "/tools/font",
    icon: "🔤",
    title: "像素字体预览器",
    description: "上传 TTF/OTF/WOFF 字体文件，在对话框、HUD、物品栏等游戏 UI 场景中预览效果。",
    tag: "字体",
  },
  {
    href: "/tools/particles",
    icon: "✨",
    title: "粒子系统预览",
    description: "实时调节粒子参数，预览火焰、爆炸、雪花、魔法等效果，导出配置 JSON。",
    tag: "特效",
  },
  {
    href: "/tools/i18n",
    icon: "🌐",
    title: "本地化管理工具",
    description: "管理游戏多语言文本，支持导入 JSON，导出扁平/嵌套 JSON 或 CSV，高亮缺失翻译。",
    tag: "本地化",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold tracking-tight mb-4">游戏开发工具集合</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          面向独立游戏开发者的一站式在线工具平台，免安装、浏览器直接可用。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-3xl">{tool.icon}</span>
                  <Badge variant="secondary">{tool.tag}</Badge>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
