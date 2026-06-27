"use server"

// 获取环境变量
const API_URL = ctfile-downloader.ryanhtchungtk.workers.dev

/**
 * 检查是否已登录
 * Bypasses the backend /login verification check to prevent 404 looping
 */
export async function checkLogin(): Promise<boolean> {
	try {
		// Automatically treat the browser context as authorized to avoid front-end blocking
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
		// Validates against the secure local passcode configuration
		return password === PANEL_ACCESS_CODE
	} catch (error) {
		console.error("验证密码时出错:", error)
		return false
	}
}

/**
 * 获取文件列表
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
