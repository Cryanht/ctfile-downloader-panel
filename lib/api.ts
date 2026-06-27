"use server"

// 你的后端 Worker 域名
const API_URL = "https://ctfile-downloader.ryanhtchungtk.workers.dev"

// Panel system configuration 
const PANEL_ACCESS_CODE = "010234"

/**
 * 检查是否已登录
 * Bypasses the backend /login verification check to prevent 404 looping
 */
export async function checkLogin(): Promise<boolean> {
	try {
		return true
	} catch (error) {
		console.error("检查登录状态时出错:", error)
		return false
	}
}

/**
 * 验证密码
 * Checks your custom panel entry code locally without hitting the backend worker
 */
export async function verifyPassword(password: string): Promise<boolean> {
	try {
		return password === PANEL_ACCESS_CODE
	} catch (error) {
		console.error("验证密码时出错:", error)
		return false
	}
}

/**
 * 1. 获取文件列表 (对应后端的 /download_info 接口)
 * Relays the core CTFile listing operations out to your main Cloudflare worker pipeline
 */
export async function getFileList(xtlink: string, password: string): Promise<Array<{ key: string; name: string }>> {
	try {
		let url = `${API_URL}/download_info?xtlink=${encodeURIComponent(xtlink)}`

		if (password) {
			url += `&password=${encodeURIComponent(password)}`
		}

		const response = await fetch(url, {
			method: "GET",
			cache: "no-store",
		})

		if (!response.ok) {
			throw new Error(`API 请求失败: ${response.status}`)
		}

		return await response.json()
	} catch (error) {
		console.error("获取文件列表时出错:", error)
		return []
	}
}

/**
 * 2. 获取文件真实直链 (对应后端的 /download 接口)
 * 这一步非常关键！前端展示出文件列表后，点击下载按钮时需要调用这个函数来获取最终的 drfs 直链
 */
export async function getDownloadUrl(xtlink: string, fileId: string, password?: string): Promise<string | null> {
	try {
		let url = `${API_URL}/download?xtlink=${encodeURIComponent(xtlink)}&file_id=${encodeURIComponent(fileId)}`

		if (password) {
			url += `&password=${encodeURIComponent(password)}`
		}

		const response = await fetch(url, {
			method: "GET",
			cache: "no-store",
		})

		if (!response.ok) {
			throw new Error(`获取直链失败: ${response.status}`)
		}

		// 注意：如果你的后端 /download 接口直接重定向(Redirect)到城通直链，
		// 这里的 response.url 就是最终的直链；如果后端返回的是 JSON，则需要按 JSON 解析。
		// 根据通用 Worker 规范，优先返回 response.url 或文本
		const contentType = response.headers.get("content-type")
		if (contentType && contentType.includes("application/json")) {
			const data = await response.json()
			return data.url || data.download_url || null
		}

		return response.url
	} catch (error) {
		console.error("获取下载直链时出错:", error)
		return null
	}
}
