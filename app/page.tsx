"use client"

import { useState } from "react"
import { LinkInput } from "@/components/link-input" // 或者是你之前的输入框组件
import { FileList } from "@/components/file-list"   // 文件列表组件

export default function Home() {
  const [parsedData, setParsedData] = useState<{ xtlink: string; files: any[] } | null>(null)

  // 💡 直接废除 isLoggedIn 的判断，不再返回登录弹窗！
  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">城通网盘解析工具</h1>
        <p className="text-muted-foreground text-sm">直接解析城通分享链接，获取高速下载直链</p>
      </div>

      {/* 始终显示输入框 */}
      <LinkInput 
        password="" 
        onSubmit={(xtlink, files) => setParsedData({ xtlink, files })} 
      />

      {/* 如果解析出文件了，就显示列表 */}
      {parsedData && (
        <FileList 
          xtlink={parsedData.xtlink} 
          files={parsedData.files} 
        />
      )}
    </main>
  )
}
