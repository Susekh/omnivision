import { Circles } from "react-loader-spinner";

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <Circles
        height={100}
        width={100}
        color="#113344"
        visible={true}
        ariaLabel="circles-loading"
        secondaryColor="#113344"
        strokeWidth={2}
        strokeWidthSecondary={2}
      />
    </div>
  );
}

export default Loader;
