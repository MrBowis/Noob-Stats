import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Platform.OS se controla por test cambiando el valor del mock compartido
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDelete = SecureStore.deleteItemAsync as jest.Mock;

// session-storage debe re-importarse después de configurar los mocks
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sessionStorage, SESSION_KEY } = require('./session-storage') as typeof import('./session-storage');

describe('SESSION_KEY', () => {
  it('tiene el valor correcto', () => {
    expect(SESSION_KEY).toBe('noobstats_session');
  });
});

describe('plataforma web (in-memory)', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
    jest.clearAllMocks();
  });

  it('getItem devuelve null si la clave no existe', async () => {
    expect(await sessionStorage.getItem('missing')).toBeNull();
  });

  it('setItem y getItem hacen round-trip', async () => {
    await sessionStorage.setItem('k', 'valor');
    expect(await sessionStorage.getItem('k')).toBe('valor');
  });

  it('removeItem elimina la clave', async () => {
    await sessionStorage.setItem('k2', 'x');
    await sessionStorage.removeItem('k2');
    expect(await sessionStorage.getItem('k2')).toBeNull();
  });

  it('no llama a SecureStore en web', async () => {
    await sessionStorage.setItem('k', 'v');
    await sessionStorage.getItem('k');
    await sessionStorage.removeItem('k');
    expect(mockGetItem).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe('plataforma nativa (SecureStore)', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    jest.clearAllMocks();
  });

  it('getItem delega en SecureStore.getItemAsync', async () => {
    mockGetItem.mockResolvedValue('stored');
    const result = await sessionStorage.getItem('myKey');
    expect(mockGetItem).toHaveBeenCalledWith('myKey');
    expect(result).toBe('stored');
  });

  it('setItem delega en SecureStore.setItemAsync', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await sessionStorage.setItem('myKey', 'myVal');
    expect(mockSetItem).toHaveBeenCalledWith('myKey', 'myVal');
  });

  it('removeItem delega en SecureStore.deleteItemAsync', async () => {
    mockDelete.mockResolvedValue(undefined);
    await sessionStorage.removeItem('myKey');
    expect(mockDelete).toHaveBeenCalledWith('myKey');
  });
});
