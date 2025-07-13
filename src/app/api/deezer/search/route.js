export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q) {
            return new Response(
                JSON.stringify({ error: "Query param 'q' is required" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: 'Erro na API Deezer' }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
