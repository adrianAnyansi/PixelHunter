// Scrape images from Twitch/Youtube player


let videoEl = document.querySelector('video')
let offCanvas = new OffscreenCanvas(videoEl.videoWidth, videoEl.videoHeight)

let canvasImg = document.createElement("img");
let blob_url = null;

function makeScreenshot () {
  offCanvas.getContext('2d').drawImage(videoEl, 0, 0) 

  const imgFormat = {type:'image/bmp', quality:1}

offCanvas.convertToBlob(imgFormat).then((blob) => {
  if (blob_url != null) {
    URL.revokeObjectURL(blob_url)
  }
  blob_url = URL.createObjectURL(blob);
  console.log(blob_url)

  canvasImg.src = blob_url;
  document.body.appendChild(canvasImg);
});
}