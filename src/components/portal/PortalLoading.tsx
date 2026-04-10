export default function PortalLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <img
        src="/imgs/icons/hexagonal.webp"
        alt=""
        className="h-12 w-12 animate-[pulse_1.4s_ease-in-out_infinite] opacity-80"
        draggable={false}
      />
    </div>
  );
}
