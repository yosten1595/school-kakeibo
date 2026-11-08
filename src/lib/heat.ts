// 表のマスの濃淡（globals.css の .heat-1〜5）。

export const HEAT_LEVELS = 5;

/**
 * 色の段階（1〜5）。表の中で共通の基準（max）にして、カテゴリをまたいで濃さを比べられるようにする。
 * 平方根をとるのは、家賃のような大きな固定費があっても、小さな金額の差が色に出るようにするため。
 */
export function heatLevel(amount: number, max: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(amount / max) * HEAT_LEVELS));
}
