
export default function IntroVideo({ onDone }) {
  return (
    <video
      src="/media/intro.mp4"
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
      onEnded={onDone}
    />
  );
}
