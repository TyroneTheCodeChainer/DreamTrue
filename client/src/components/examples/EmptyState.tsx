import EmptyState from '../EmptyState';

export default function EmptyStateExample() {
  return (
    <div className="p-4 space-y-8">
      <EmptyState 
        type="dreams" 
        onAction={() => console.log('Action clicked')} 
      />
      <div className="border-t pt-8">
        <EmptyState 
          type="patterns" 
          onAction={() => console.log('Action clicked')} 
        />
      </div>
    </div>
  );
}
