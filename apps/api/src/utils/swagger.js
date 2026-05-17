import swaggerJsdoc from 'swagger-jsdoc';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'SellMind API',
			version: '1.0.0',
			description: 'API para geração de páginas de vendas e chat com IA. Autenticação via Bearer token do Supabase.',
		},
		servers: [
			{ url: 'http://localhost:3001', description: 'Desenvolvimento' },
			{ url: 'https://sellmind-api.up.railway.app', description: 'Produção' },
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Token de acesso do Supabase (supabase.auth.getSession().access_token)',
				},
			},
			schemas: {
				Error: {
					type: 'object',
					properties: {
						error: { type: 'string', example: 'Mensagem de erro' },
					},
				},
			},
		},
		security: [{ bearerAuth: [] }],
	},
	apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
