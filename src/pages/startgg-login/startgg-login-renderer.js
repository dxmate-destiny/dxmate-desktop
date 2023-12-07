const startggSigninButton = document.querySelector('#sign-in-button');
const startggSignupButton = document.querySelector('#sign-up-button');

startggSigninButton.addEventListener('click', async () => {
    await window.api.signInWithStartgg();
});