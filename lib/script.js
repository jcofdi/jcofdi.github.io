function getDecimalPlaces(num) {
    let str = num.toString();
    if (str.includes('.')) {
        return str.split('.')[1].length;
    }
    return 0;
}

function swapValues() {
    let widthElement = document.getElementById('userDesiredAR_Width');
    let heightElement = document.getElementById('userDesiredAR_Height');
    let temp = widthElement.value;
    widthElement.value = heightElement.value;
    heightElement.value = temp;
}

function calculateValues() {
    let userWidth = parseFloat(document.getElementById('userWidth').value);
    let userHeight = parseFloat(document.getElementById('userHeight').value);
    let userDesiredMegaPixels = parseFloat(document.getElementById('userDesiredMegaPixels').value);
    let userDesiredAR_Width = parseFloat(document.getElementById('userDesiredAR_Width').value);
    let userDesiredAR_Height = parseFloat(document.getElementById('userDesiredAR_Height').value);

    let decimalFactor = Math.max(getDecimalPlaces(userDesiredAR_Width), getDecimalPlaces(userDesiredAR_Height));
    let ActualAR_Ratio;
    let previewRes_Width;
    let previewRes_Height;
    let targetRes_Width;
    let targetRes_Height;

    ActualAR_Ratio = userWidth / userHeight;

    if ((userDesiredAR_Width / userDesiredAR_Height) > (userWidth / userHeight)) {
        previewRes_Width = Math.floor(userWidth / (userDesiredAR_Width * 10 ** decimalFactor)) * userDesiredAR_Width * 10 ** decimalFactor;
        previewRes_Height = previewRes_Width * (userDesiredAR_Height / userDesiredAR_Width);
    } else {
        previewRes_Height = Math.floor(userHeight / (userDesiredAR_Height * 10 ** decimalFactor)) * userDesiredAR_Height * 10 ** decimalFactor;
        previewRes_Width = previewRes_Height * (userDesiredAR_Width / userDesiredAR_Height);
    }

    targetRes_Width = Math.floor(((userDesiredMegaPixels * 1000000 / (userDesiredAR_Height * 10 ** decimalFactor)) / (userDesiredAR_Width * 10 ** decimalFactor)) ** (1 / 2)) * (userDesiredAR_Width * 10 ** decimalFactor);
    targetRes_Height = targetRes_Width * userDesiredAR_Height / userDesiredAR_Width;

    document.getElementById('previewRes_Width').textContent = previewRes_Width;
    document.getElementById('previewRes_Height').textContent = previewRes_Height;
    document.getElementById('targetRes_Width').textContent = targetRes_Width;
    document.getElementById('targetRes_Height').textContent = targetRes_Height;
}
