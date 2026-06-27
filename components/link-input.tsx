"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFileList } from "@/lib/api"

interface LinkInputProps {
  onSubmit: (link: string, files: Array<{ key: string; name: string }>) => void
  password: string
}

export function LinkInput({ onSubmit, password }: LinkInputProps) {
  const [link, setLink] = useState("")
  const [customPassword, setCustomPassword] = useState("") // 新增：允许手动输提取码
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!link.trim()) {
      setError("请输入城通网盘链接")
      return
    }

    let rawLink = link.trim()
    let xtlink = rawLink
    let finalPassword = customPassword.trim()

    // 1. 尝试从标准城通网址里提取密码 (?p=XXXX)
    if (rawLink.includes("?p=")) {
      const urlSearchParams = new URLSearchParams(rawLink.split("?")[1])
      const pParam = urlSearchParams.get("p")
      if (pParam) {
        finalPassword = pParam
      }
    }

    // 2. 智能兼容各种链接格式，提取出纯 ID (例如: 66264526-17569817568723-98e11c)
    if (xtlink.startsWith("ctfile://")) {
      xtlink = xtlink.substring(9)
    } else if (xtlink.includes("ctfile.com/")) {
      // 如果输入的是 https://url26.ctfile.com/f/xxxxxxx?p=xxxx 格式
      const urlPath = xtlink.split("?")[0] // 先去掉问号后面的尾巴
      const parts = urlPath.split("/")
      xtlink = parts[parts.length - 1] // 取最后一部分作为 ID
    }

    try {
      setIsLoading(true)
      setError(null)

      // 如果网址里和输入框都没提取码，才使用组件默认传入的密码
      const apiPassword = finalPassword || password

      // 发送清洗后的纯 ID 和提取码给后端 Worker
      const files = await getFileList(xtlink, apiPassword)

      if (files && files.length > 0) {
        onSubmit(xtlink, files)
      } else {
        setError("未找到文件或链接无效。如果是私密分享，请确保输入了正确的 4 位提取码。")
      }
    } catch (err) {
      setError("获取文件列表失败，请检查链接或后端 Worker 状态")
      console.error("获取文件列表时出错:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">输入城通网盘链接</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="link">城通链接 / 资源 ID</Label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="支持粘贴完整网页链接或纯 ID"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customPassword">文件提取码 (可选)</Label>
          <Input
            id="customPassword"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.target.value)}
            placeholder="如果链接里包含 ?p=xxxx 则无需填写"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">支持格式：直接粘贴含有 ?p=5536 的完整分享链接，面板会自动提取密码。</p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "解析中..." : "解析链接"}
        </Button>
      </form>
    </div>
  )
}
