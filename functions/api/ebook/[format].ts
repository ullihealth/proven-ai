// Proxy ebook downloads from R2 with proper Content-Disposition headers
// GET /api/ebook/pdf | /api/ebook/epub | /api/ebook/mobi

const EBOOK_BASE_URL = 'https://pub-728ac07641004319ab586b593cd32945.r2.dev/ebook';

const FORMAT_MAP: Record<string, { file: string; contentType: string; filename: string }> = {
  pdf: {
    file: 'Using-AI-After-40-Print.pdf',
    contentType: 'application/pdf',
    filename: 'Using-AI-After-40.pdf',
  },
  epub: {
    file: 'Using-AI-After-40-Apple.epub',
    contentType: 'application/epub+zip',
    filename: 'Using-AI-After-40.epub',
  },
  mobi: {
    file: 'Using-AI-After-40-Kindle.mobi',
    contentType: 'application/x-mobipocket-ebook',
    filename: 'Using-AI-After-40.mobi',
  },
};

export const onRequestGet: PagesFunction = async ({ params }) => {
  const format = (params.format as string).toLowerCase();
  const entry = FORMAT_MAP[format];

  if (!entry) {
    return new Response('Invalid format. Use: pdf, epub, or mobi', { status: 400 });
  }

  // Fetch the file from R2 public bucket
  const r2Response = await fetch(`${EBOOK_BASE_URL}/${entry.file}`);

  if (!r2Response.ok) {
    return new Response('File not found', { status: 404 });
  }

  // Return with Content-Disposition: attachment to force download
  return new Response(r2Response.body, {
    headers: {
      'Content-Type': entry.contentType,
      'Content-Disposition': `attachment; filename="${entry.filename}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
