import { PapelUsuario } from './papel-usuario.enum';

describe('PapelUsuario', () => {
  it('define os dois papéis usados pelos guards de autorização', () => {
    expect(PapelUsuario.ADMIN).toBe('ADMIN');
    expect(PapelUsuario.CLIENTE).toBe('CLIENTE');
  });
});
