export default function PortalLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <div className="relative flex items-center justify-center">
        {/* Ring pulse */}
        <span className="absolute h-16 w-16 animate-portal-ring rounded-full border-2 border-primary/30" />

        {/* Hexagon icon */}
        <img
          src="/imgs/icons/hexagonal.webp"
          alt=""
          className="h-10 w-10 animate-portal-spin"
          draggable={false}
        />
      </div>
    </div>
  );
}
