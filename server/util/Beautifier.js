import dot from 'dot-object'

export const processResponse = (response) => {
    let data = {};
    response.result[0].prediction.map(prediction => {
        if (prediction.label === 'provider.area' || prediction.label === 'patient.shippingAddress.area' || prediction.label === 'patient.billingAddress.area') {
            const label = prediction.label.replace('.area', '')
            const area = prediction.ocr_text.split(",")
            data["prediction"] = {
                [`${label}.city`]: area[0].trim(),
                [`${label}.state`]: area[1].trim(),
                [`${label}.zip`]: area[2].trim(),
                ...data["prediction"]
            }
        } else {
            data["prediction"] = {[prediction.label]: prediction.ocr_text, ...data["prediction"]}
        }
    })
    data["prediction"] = dot.object(data["prediction"])
    data["prediction"]["provider"]["NPI"] = data.prediction.provider.NPI.join('')
    data["fileId"] = response.result[0].filepath.split("/")[3].split(".")[0]
    return data
}
export const beautifyResponse = (response) => {
    const data = {}
    response.result[0].prediction.map(prediction => {
        if (prediction.label === 'provider.area' || prediction.label === 'patient.shippingAddress.area' || prediction.label === 'patient.billingAddress.area') {
            const label = prediction.label.replace('.area', '')
            const area = prediction.ocr_text.split(",")
            data["prediction"] = {
                [`${label}.city`]: area[0].trim(),
                [`${label}.state`]: area[1].trim(),
                [`${label}.zip`]: area[2].trim(),
                ...data["prediction"]
            }
        } else {
            data["prediction"] = {[prediction.label]: prediction.ocr_text, ...data["prediction"]}
        }
    })
    data["id"] = response.result[0].id
    data["prediction"] = dot.object(data["prediction"])
    return data
}