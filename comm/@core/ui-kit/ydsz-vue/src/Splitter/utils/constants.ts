/**
 * Splitter 拖拽约束位标志常量。
 *
 * <p>从 registry.ts 下沉到独立文件，解除 registry ↔ style 的循环依赖：
 * 两者都需要这些位标志，但谁都不该依赖对方的运行期逻辑。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\Splitter\utils\constants.ts
 * @author ydsz-team
 * @since 26.11.06
 */

/** 水平方向触达最小约束 */
export const EXCEEDED_HORIZONTAL_MIN = 0b0001;

/** 水平方向触达最大约束 */
export const EXCEEDED_HORIZONTAL_MAX = 0b0010;

/** 垂直方向触达最小约束 */
export const EXCEEDED_VERTICAL_MIN = 0b0100;

/** 垂直方向触达最大约束 */
export const EXCEEDED_VERTICAL_MAX = 0b1000;
