const keytar = require('keytar');

const SERVICE_NAME = 'dxmate';
const ACCOUNT_NAME = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token'
};

async function loadStartggCredentials () {
    // Get startgg credentials.
    const startggCredentials = {
        accessToken: await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME.accessToken),
        refreshToken: await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME.refreshToken)
    };

    if (!startggCredentials.accessToken || !startggCredentials.refreshToken) {
        return null;
    }

    return startggCredentials;
}

async function saveStartggCredentials (accessToken, refreshToken) {
    // Save startgg credentials.
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME.accessToken, accessToken);
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME.refreshToken, refreshToken);
}

async function deleteStartggCredentials () {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME.accessToken);
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME.refreshToken);
}

module.exports = {
    loadStartggCredentials,
    saveStartggCredentials,
    deleteStartggCredentials
}