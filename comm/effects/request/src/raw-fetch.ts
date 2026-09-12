/**
 * 原生 fetch 收口封装（基础设施层直用通道）。
 *
 * <p>统一收口业务侧「无统一请求客户端上下文」的原始 HTTP 拉取场景，
 * 典型如跨域对象存储预签名 URL、二进制流下载。统一客户端
 * （{@link ./request-client}）的 baseURL 注入、鉴权头与 JSON 信封解包
 * 对此类请求均不适用。
 *
 * <p>业务层（apps/\*、main/\*）禁止直接调用原生 `fetch`，须通过本封装；
 * 新增直用场景前请先评估是否可由统一客户端承载（规范 §6.1）。
 *
 * @path comm\effects\request\src\raw-fetch.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 以原生 fetch 发起请求并返回原始 Response。
 *
 * <p>调用方自行负责状态码检查与响应体解析（text / blob / stream）。
 *
 * @param input 请求 URL（完整绝对地址）
 * @param init 可选的 fetch 初始化参数
 * @returns 原始 Response 对象
 */
// @infra-fetch 基础设施层直用，无统一客户端上下文（跨域预签名存储 URL / 二进制流）
export async function fetchRaw(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, init);
}
