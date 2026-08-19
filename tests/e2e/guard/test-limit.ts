/**
 * E2E でガードの遮断挙動を検証するときのしきい値。
 *
 * 本番のしきい値（`RATE_LIMIT_BUCKETS`）をそのまま使うと、超過させるために
 * 大量のリクエストを送ることになり CI が現実的な時間で終わらない。
 * public-get は 300 req/分あるため、バーストだけで 305 リクエストが必要になり、
 * webkit の E2E が 5 分 → 20 分に悪化して 30 分のジョブ制限に達した。
 *
 * E2E が担保すべきなのは「超過したら 429 が返る」「ヘッダーが付く」といった
 * **挙動**であって、しきい値そのものではない。本番の数値は
 * `tests/components/guard/runGuard.spec.ts` の RATE_LIMIT_BUCKETS の
 * アサーションで担保している。
 *
 * この値は playwright.config.ts の webServer に GUARD_TEST_LIMIT として渡し、
 * `getDefaultLimiter` が APP_ENV=test のときだけ適用する。
 */
export const GUARD_TEST_LIMIT = 20;
