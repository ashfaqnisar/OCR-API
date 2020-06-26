import dot from 'dot-object'

export const processResponse = (response) => {
    let data = {};
    const areas = ["provider.area", "patient.shippingAddress.area", "patient.billingAddress.area"]
    data["uploadedFile"] = response.result[0].input
    data["prediction"] = {}
    response.result[0].prediction.map(prediction => {
        if (areas.includes(prediction.label)) {
            const label = prediction.label.replace('.area', '')
            const area = prediction.ocr_text.split(",")
            data["prediction"] = {
                [`${label}.city`]: area[0],
                [`${label}.state`]: area[1],
                [`${label}.zip`]: area[2],
                ...data["prediction"]
            }
        } else {
            data["prediction"] = {[prediction.label]: prediction.ocr_text, ...data["prediction"]}
        }
    })
    data["prediction"] = dot.object(data["prediction"])
    data["gcsFile"] = response.result[0].filepath.split("/")[3].split(".")[0]
    return data
}