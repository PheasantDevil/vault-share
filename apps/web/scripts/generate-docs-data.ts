/**
 * docs 検索用インデックスを生成する（prebuild / predev）
 */
import { generateDocsArtifacts } from '../src/lib/docs/generate-artifacts';

generateDocsArtifacts().catch((err) => {
  console.error(err);
  process.exit(1);
});
