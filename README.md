<h1 align="center">
  <br>
  <a href="https://github.com/ashfaqnisar/ESOCR.git"><img src="https://i.imgur.com/tJ4s0sJ.png" alt="ESOCR"></a>
</h1>

<h3 align="center">Exact Sciences Optical Character Recognition API</h4>

<p align="center">
    <a href="https://github.com/ashfaqnisar/esocr-api/commits/master">
    <img src="https://img.shields.io/github/last-commit/ashfaqnisar/esocr-api?style=flat-square&logo=github&logoColor=white"
         alt="GitHub last commit">
   <a href="https://github.com/ashfaqnisar/esocr-api/pulls">
    <img src="https://img.shields.io/github/issues-pr/ashfaqnisar/esocr-api?style=flat-square&logo=github&logoColor=white"
         alt="GitHub pull requests">
      <a href="https://github.com/ashfaqnisar/esocr-api/pulls?q=is%3Apr+is%3Aclosed">
    <img src="https://img.shields.io/github/issues-pr-closed/ashfaqnisar/esocr-api?style=flat-square&logo=github&logoColor=white"
         alt="GitHub pull requests">
        <a href="https://github.com/ashfaqnisar/esocr-api/#contributors"></>
    <img src="https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square&logo=github&logoColor=white"
         alt="All Contributors">
</p>



<p align="center"> 
  <a href="#demo">Demo</a> •
    <a href="#demo">Problem Statement</a> •
  <a href="#objectives">Objectives</a> •
  <a href="#solution">Solution</a> •
  <a href="#features">Features</a> •
  <a href="#milestones">Milestones</a> •
  <a href="#enchancements">Enchancements</a> •
  <a href="#installation">Installation</a> •
  <a href="#stack">Stack</a> 

</p>

---
## Demo
[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/4ae3eeaa8b760bf5941f#?env%5BHeroku%5D=W3sia2V5IjoiZW5kcG9pbnQiLCJ2YWx1ZSI6Imh0dHBzOi8vZXNvY3ItYXBpLmhlcm9rdWFwcC5jb20iLCJlbmFibGVkIjp0cnVlfV0=)

[![View Documentation](https://i.imgur.com/ZA83nhL.png)](https://documenter.getpostman.com/view/2498562/T17AkWcn?version=latest)

### <a href="https://esocr-api.herokuapp.com/" target="_blank">ESOCR API Demo</a> • <a href="https://github.com/ashfaqnisar/esocr" target="_blank">ESOCR Frontend Repo</a> • <a href="https://github.com/ashfaqnisar/ESOCR-DATASET-GENERATOR" target="_blank">ESOCR Dataset Generator Repo</a>

## Problem Statement: 
Building a **highly accurate OCR solution** that will take **manually filled form** as an **input** and provide the **data in the digital form**. 

As the exact sciences company **process thousands of the forms** every week received from the **fax**. The data received in the form should be **digitalized**.  But, **manually digitalizing** the form would contain **human error** & **time-consuming**.  So, they would like to **automate this process** by placing the OCR system. The exact sciences company **already has an OCR system** in place but is **somewhat less accurate** and **takes more time.**

<p align="center">
  <img src="https://i.imgur.com/P7Q0VG1.png" /> 
</p>

## Objectives
####  • Building an OCR system, which would be faster and accurate compared to the already present OCR system.
####  • Developing the API  in a manner that it can be easily be customized and scaled according to the requirements.
 
####  • The OCR system should also be able to handle handwritten form provided by the user.
  
####  • Ability to handle different types of file format such as the images, PDF & TIFF.

####  • The response received from the API should be displayed in a digital form.

####  • The whole project should meet the industrial coding standards.

#### • Staying in Budget, while utilizing the COTS OCR solutions.

## Solution: 

As Exact Sciences company already has an OCR system in place, we had to **build a system** which would be **more accurate** and **less time consuming** than the **present OCR  system**.  Most of the forms received by the company are **handwritten by the user**. So, we had to take that constraint in mind too. We were allowed to use the COTS(Commercially Off the Shelf  ) OCR solution but we had to **stay in the budget** and **not go overboard.**
<br/>

After making extensive research and **chatting with different COTS OCR solutions**, we were impressed with the **<a href="https://nanonets.com/">Nanonets OCR Solution</a>**. As it was very simple and straightforward and they were using the **CRNN(Convolutional Recurrent Neural Network)** &  **DRAM (Deep Recurrent Attention Model)**  and many more to **create an OCR detection model**. Coming to the pricing, we would be **charged** by the number of **API calls made to the model.**
<br/>

We **created a model** in the nanonets but **in order to train the model**. We required a **dataset of images** and we were provided with two files(**Sample Form  & Blank form**). To process the model, we needed over **150  files** and **manually filling these forms** would have been a **very time-effective process**. 

We built <a href="https://github.com/ashfaqnisar/ESOCR-DATASET-GENERATOR" target="_blank">**ESOCR Dataset Generator Repo**</a>,  which would **contain a script** which would take **data** from the **fake JSON** and place the **data over PSD** and **save the final output file**. In this manner, we were easily able to **generate around 150 images** for the dataset.
Once, we **uploaded the images to the nanonets**, we started **annotating the images one by one manually** in nanonets. We then **started training the model**, once the **model was trained**. We were able to **predict the text** from the **uploaded image**.

We built an <a href="https://github.com/ashfaqnisar/ESOCR-API" target="_blank">**API** </a>to **interact with the Nanonets API**. So, if we were to **send a file to the API**, the **file will be processed** by the model & **provide us with the response**. The API would then **beautify and store the response** in **firebase** and **upload** the file to the **Google Cloud**. API  can easily be configured to upload the data to any **preferred cloud**. As **provided in the problem statement** ,the data received from the OCR should be sent to a **digital form**. So, we started **working on building the frontend** for the project 
>**Note**: . Later on in the call with exact sciences, it was verified that they are mainly looking for an pure API solution. But, until then, we had already built the frontend!
<br/>

Coming to the **<a href="https://esocr.now.sh">frontend</a>**, we created a **dashboard** from which the **user can upload the scanned files** to the API which would then be processed and **results will be provided to the user in a digital form**. The user can also **update the data from the digital form.** 

<table>
<tr>
<td>
<p align="center">
  <img src="https://i.imgur.com/cjZEixP.gif" /> 
</p>
</td>
</tr>
</table>

## Features
### Handling Handwritten Font: 
As one of the main objectives of our system was the ability to **detect the handwritten fonts** from the form. We are able to achieve that using **our ESOCR system**. 
| | | 
|:-------------------------:|:-------------------------:|
|<img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/lPMSGll.jpg">  |  <img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/vVsco0N.jpg">
|<img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/UL74B4Z.jpg">  |  <img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/V7pmkmK.jpg">

In order **to achieve this**, we had to **train our model** with  **different types of handwritten fonts**.
### Quick response time:
<img src="https://i.imgur.com/JehGihA.jpg" /> 

Coming to **response time**, we were able to **process the whole document** approx under **22- 25 sec** for this **<a href="https://esocr.imgix.net/ZK9M8ho11uRsljzsHICykGlC8iI3/1228834312.jpg">file</a>**. **Time may differ** based on the **quality of the file**,  **size of the file** and the **type of file**.
> Note: The response time can be **decreased by hosting** the **docker container** on our cloud and providing **more processing power**.

### Simple and pleasant user interface:
| | | 
|:-------------------------:|:-------------------------:|
|<img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/97opSZO.jpg">  |  <img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/imSR8DY.jpg">|

<img src="https://i.imgur.com/hGd7GWB.jpg" />

The front end of the Esocr is **very simple** and **straight forward** and **can be customized easily ** according to our requirements.  All of the **processed forms** of the user are available in the **ESOCR Web App**. 

### Customizable Response:
We can easily **customize the fields** and also **add new fields** in the **nanonets** easily. Let's suppose if we want to **add a field** called "**email address**" in the patient information.  We can add that **field in nanonets** by creating a field called "**patient.emailAddress**" .  Below are some of the sample responses  from the OCR system.
#### Sample Raw Response: 
```js
{
  {
    "message": "Success",
    "result": [
        {
            "message": "Success",
            "input": "db0301a5-e2fe-4ada-9c1a-cab2a973db0a.jpg",
            "prediction": [
                {
                    "label": "provider.healthCare",
                    "xmin": 704,
                    "ymin": 460,
                    "xmax": 921,
                    "ymax": 502,
                    "score": 1,
                    "ocr_text": "EXOSPACE"
                },
                {
                    "label": "provider.name",
                    "xmin": 429,
                    "ymin": 559,
                    "xmax": 563,
                    "ymax": 602,
                    "score": 1,
                    "ocr_text": "Mcgee"
                }// Many other fields present Here!!!   
            ],
            "page": 0,
            "request_file_id": "0450e9a2-df44-4ed0-96b9-b38d831aeefc",
            "filepath": "uploadedfiles/4ed6dcd3....../PredictionImages/356437671.jpeg",
            "id": "68d096fd-b93e-11ea-8789-b655b7b9b939"
        }
    ]
}

```
#### Sample Beautified Raw Response: 
```js
{
    "uploadedFile": "sampleForm.jpg",
    "prediction": {
        "date": "10/04/2019",
        "billing": {
            "priorAuthorizationCode": "209750134",
            "policyNumber": "484150",
            "plan": "platinum",
            "groupNumber": "153806",
            "claimsSubmissionAddress": "565 Llama court, kentucky, 960309",
            "primaryInsurance": "waretel",
            "policyHolder": {
                "dob": "04/08/2016",
                "name": "_Velasquez"
            }
        }// Many other fields present Here!!!   
    },
    "id": "2a989b8c-b93d-11ea-ac49-2afb8b0efd3c"
}
```

### Process OCR even with the deviated alignment of the form:
Even, if the **form** or **document** is a **little bit misaligned** the system would be able to **detect the fields** from the form. 

### Cost-Efficient Solution:
At present to extract one text field from the form,  it is cost around $0.0099. If there are 100 fields in a form it would cost $0.0099x100=$0.99/Document. In order to process around 100 documents, it would cost around $99. This cost is for creating the model, training and providing the model as an API. 

If we are **daily processing around 1000 documents** per day, it would cost us a  **huge amount of money**. But, there is a solution to this issue.  We had a **call with the Nanonets sales team** and after telling them all of **our requirements**. The **customized solution** with the **radio buttons** included would cost us around **approx 499 dollars**.They would be willing to provide us with the **whole model** & API as a **docker container** which can be **hosted on any preferred cloud**.

### Ability to update the extracted data from the web application:
<img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://i.imgur.com/HmGPJqH.png">

As all of the **processed data is available** in the **firebase**. We can **update the data** and **fix any wrong predictions** from the **form available in the ESOCR Web App**.

### Process multiple forms at a time:
<img width="1604" alt="screen shot 2017-08-07 at 12 18 15 pm" src="https://im3.ezgif.com/tmp/ezgif-3-ad593ba65a7a.gif">

We can make **multiple requests to the API** to process multiple forms **simultaneously** and **increase the overall performance** of the app and **decrease the time required** for the **processing** of the multiple files. 

### Ability to process images/PDFs on the fly using Imgix:
As the web app, was **not able to render the PDF/other file formats directly** and **performing file conversions** to handle them would have been more **time consuming** and **not that effective**. To solve this issue, we started using the **imgix**, which would connect with our **google cloud bucket** and **host all of the files by itself**. Imgix was very helpful in **decreasing/increasing the size** of the images and also **formatting them**. **[Here](https://esocr.imgix.net/t1hzdziyu7tyMglnDQPH/1228834312.pdf?fm=png&or=0)** is a sample pdf formatted by the imgix as a png. 


## Milestones

#### 1. We **automatically generated** and **manually annotated** over 150 images for training the model.
#### 2. We were able to **predict the handwritten text** in the sample form which was sent to the API for processing. 
#### 3. We built the API which would **store responses** as well as **data** in the firestore firebase and Google cloud respectively received from the model.
#### 4. We were successful in hosting the API at Heroku.
#### 5. We built thorough documentation of the API.
#### 6. Able to make the frontend talk with the firestore database using the API as the middleman
#### 7. For the frontend, we were able to format all the different file types into JPEG's on the fly without any file conversion of the input file using the imgix.

## Enchancements
#### The goals of this application were purposely kept within what was believed to be attainable within the allotted timeline and resources. As such, many enhancements can be made upon this initial design. The following are the milestones intended for future expansion and enhancement of the project.

-   As, we were only able to **purchase the medium pricing plan** for the **OCR detection**.  It **didn't include** the **radio buttons facility**. But, in the future,  If we are **selected by the exact sciences company**. We would either **purchase the large pricing plan** or **custom pricing plan** which would include the **radio buttons functionality** . 
    
-   **Increasing the training data** for the **OCR detection** from **150 images to 500 images**
    
-   Hosting the **docker container** on our **cloud** to **increase the speed** of the **processing of the documents.**

## Installation
Use the package manager [yarn](https://yarnpkg.com/lang/en/docs/install/#windows-stable) to install the yarn in your system.

After **cloning the repo** to your system, run the following commands in the project folder.

#### 1. Yarn Install:
The **yarn install** command is used to install all the different dependencies which are present in the project.
```bash
yarn install
```

#### 2. Yarn watch:dev:
The **yarn watch:dev** command  will start the project and listen for any sort of changes in the folder.
```bash
yarn watch:dev
```
 Open **http://localhost:8080** to check the project .

## Stack 
### API Technology Stack:
**Express JS:** We have used Express JS to create the API as it is very **robust**, **small** and **provides a range of features**.

**Nanonets API:** The Nanonets API is used to **process the image/pdf** provided to it and **provide the results back** to the ESOCR API.

**Firestore Database:** We have used the **Firebase Firestore database** to store all of the form-data gathered from the provided form.

**Rest API:** The API is **very flexible** and can **modify the API** according to our requirements and the API can be **easily scalable**.

**Babel:** We have used to babel to **convert the ES6 code** into **ES5 code**. For the node to **understand the code**. 

### Frontend Tech Stack: 
**React JS:** React JS is very useful while **creating web apps** that are **data-driven**. React is **fast, scalable, and responsive.**

**Material UI:** We have consistently used **Material UI components** throughout the application. In order to make the **web app beautiful** & **responsive across all the devices**.

**SWR**: We have used **SWR** for **fetching the data** as it **stores the data in the cache** and has many awesome features.

**React Redux:** We used **redux to handle the complex states** of the application and thunk to make the API calls to the backend.

**SASS/SCSS:**  SASS is **way powerful** than generic CSS. We have opted to **build the styles in SCSS** for the application.

## Contributors ✨: 

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://sourcerer.io/ashfaqnisar"><img src="https://avatars0.githubusercontent.com/u/20638539?v=4" width="100px;" alt=""/><br /><sub><b>Ashfaq Nisar</b></sub></a><br /><a href="#design-ashfaqnisar" title="Design">🎨</a> <a href="https://github.com/ashfaqnisar/ESOCR/commits?author=ashfaqnisar" title="Code">💻</a> <a href="#infra-ashfaqnisar" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/ashfaqnisar/ESOCR/commits?author=ashfaqnisar" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/vamshikrishnaginna"><img src="https://avatars1.githubusercontent.com/u/35305744?v=4" width="100px;" alt=""/><br /><sub><b>Vamshi Krishna</b></sub></a><br /><a href="#ideas-vamshikrishnaginna" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-vamshikrishnaginna" title="Design">🎨</a> <a href="https://github.com/ashfaqnisar/ESOCR/commits?author=vamshikrishnaginna" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!
