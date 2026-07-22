import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const registerWithEmail = { execute: jest.fn() };
  const loginWithEmail = { execute: jest.fn() };
  const loginWithGoogle = { execute: jest.fn() };
  const getGoogleAuthUrl = { execute: jest.fn() };
  const getProfile = { execute: jest.fn() };
  const refreshToken = { execute: jest.fn() };
  const updateProfile = { execute: jest.fn() };

  const controller = new AuthController(
    registerWithEmail as never,
    loginWithEmail as never,
    loginWithGoogle as never,
    getGoogleAuthUrl as never,
    getProfile as never,
    refreshToken as never,
    updateProfile as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('register delega en RegisterWithEmailUseCase', () => {
    void controller.register({
      email: 'a@b.com',
      password: 'secret123',
      nombres: 'A',
      apellidos: 'B',
    });
    expect(registerWithEmail.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.com', nombres: 'A' }),
    );
  });

  it('login delega en LoginWithEmailUseCase', () => {
    void controller.login({ email: 'a@b.com', password: 'secret123' });
    expect(loginWithEmail.execute).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret123',
    });
  });

  it('googleUrl devuelve { url } desde GetGoogleAuthUrlUseCase', async () => {
    getGoogleAuthUrl.execute.mockResolvedValue('https://oauth.url');
    const result = await controller.googleUrl('noobstats://auth-callback');
    expect(getGoogleAuthUrl.execute).toHaveBeenCalledWith({
      redirectTo: 'noobstats://auth-callback',
    });
    expect(result).toEqual({ url: 'https://oauth.url' });
  });

  it('refresh delega en RefreshTokenUseCase', () => {
    void controller.refresh({ refreshToken: 'rt-123' });
    expect(refreshToken.execute).toHaveBeenCalledWith({
      refreshToken: 'rt-123',
    });
  });

  it('googleCallback delega en LoginWithGoogleUseCase', () => {
    void controller.googleCallback({ accessToken: 'tok' });
    expect(loginWithGoogle.execute).toHaveBeenCalledWith({
      accessToken: 'tok',
    });
  });

  it('me delega en GetProfileUseCase con el id del usuario', () => {
    void controller.me({ id: 'auth-1', email: 'a@b.com', fullName: null });
    expect(getProfile.execute).toHaveBeenCalledWith({ authId: 'auth-1' });
  });

  it('updateMe delega en UpdateProfileUseCase con el id del usuario', () => {
    void controller.updateMe(
      { id: 'auth-1', email: 'a@b.com', fullName: null },
      { nombres: 'Nuevo' },
    );
    expect(updateProfile.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-1', nombres: 'Nuevo' }),
    );
  });
});
