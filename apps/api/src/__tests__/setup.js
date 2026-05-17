// Define variáveis de ambiente antes de qualquer import de módulo
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent'; // silencia logs durante os testes
