// Minimal MediaWiki api.php helpers shared by the game adapters.
const USER_AGENT = 'ability-comparer/0.1 (https://github.com/henqeb/ability-comparer)'

export async function fetchWikitext(apiUrl: string, page: string): Promise<string> {
  const url = new URL(apiUrl)
  url.search = new URLSearchParams({
    action: 'parse',
    page,
    prop: 'wikitext',
    redirects: '1',
    format: 'json',
    formatversion: '2',
  }).toString()
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`${page}: HTTP ${res.status}`)
  const body = (await res.json()) as { parse?: { wikitext: string }; error?: { info: string } }
  if (!body.parse) throw new Error(`${page}: ${body.error?.info ?? 'no wikitext in response'}`)
  return body.parse.wikitext
}

// Strips links, templates, tags and bold/italic quotes, keeping the visible text.
export function toPlainText(wikitext: string): string {
  return wikitext
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1') // [[Page|label]], [[Page]]
    .replace(/\{\{[^{}|]*\|(?:[^{}]*\|)?([^{}|]*)\}\}/g, '$1') // {{T|...|label}} → label
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/'{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
