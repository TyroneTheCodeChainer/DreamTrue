import ConfidenceMeter from '../ConfidenceMeter';

export default function ConfidenceMeterExample() {
  return (
    <div className="p-4 flex gap-6 items-center justify-center">
      <ConfidenceMeter score={85} />
      <ConfidenceMeter score={65} size={100} />
      <ConfidenceMeter score={45} size={80} />
    </div>
  );
}
