export const processResponse = (response) => {
    let data = {};
    data["uploadedFile"] = response.result[0].input
    data["prediction"] = {}
    response.result[0].prediction.map((prediction) => {
        data["prediction"] = {[prediction.label]: {text: prediction.ocr_text}, ...data["prediction"]}
    })
    data["fileId"] = response.result[0].filepath.split("/")[3].split(".")[0]
    return data
}