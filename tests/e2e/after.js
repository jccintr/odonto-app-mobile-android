const { configure } = require('@testing-library/react-native');

// a API é de verdade (banco incluso): as esperas dos testes são mais generosas que o padrão de 1 s
configure({ asyncUtilTimeout: 6000 });

// cada teste começa deslogado: o cofre do aparelho (em memória) e a sessão do cliente são zerados
afterEach(async () => {
  require('expo-secure-store').__store.clear();
  await require('../../src/api/client').setSession(null);
});

// Estes testes falam com a API de verdade: as respostas chegam fora do controle do teste e o React avisa "not wrapped in act(...)".
// O aviso é só ruído (o teste espera pela tela com findBy/until), então ele é silenciado; qualquer outro erro continua aparecendo.
const realError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
    realError(...args);
  });
});
afterAll(() => console.error.mockRestore?.());
