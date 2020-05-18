export const processResponse = (response) => {
    let data = {};
    data["input"] = response.result[0].input
    data["filepath"] = response.result[0].filepath
    data["prediction"] = {}
    response.result[0].prediction.map((prediction) => {
        data["prediction"] = {[prediction.label]: {text: prediction.ocr_text}, ...data["prediction"]}
    })
    data["filename"] = response.result[0].filepath.split("/")[3].split(".")[0]
    return data

}