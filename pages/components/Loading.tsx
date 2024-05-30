type loading  = {isLoad:boolean,isContentLoad:boolean,loadWord:string}
export default function Loading({isLoad,isContentLoad,loadWord}:loading) {
  return (
    <>
      {isLoad ? 
      isContentLoad ? 
      <div className="splash-wrap">
        <p className="splash-word">{loadWord}</p>
        <div className="splash-bg"></div>
        <div className="splash-bg-after"></div>
      </div> : 
      <div className="splash-wrap fadeOut">
        <div className="h-600">
          <div className="img-box--words h-335">
            <h1 className={isContentLoad ? 'opacity0' : ''}>Gloomy Store</h1>
            <p className={isContentLoad ? 'opacity0' : ''}>Frontend Developer&apos;s portfolio</p>
          </div>
        </div>
        <div className="splash-bg active"></div>
        <div className="splash-bg-after active"></div>
      </div>
        :
        null
      }
    </>
  );
}
