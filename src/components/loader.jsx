import { Circles } from "react-loader-spinner";

function Loader() {
  return (
    <Circles
      height={100}
      width={100}
      color="#113344"
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
      ariaLabel="circles-loading"
      secondaryColor="#113344"
      strokeWidth={2}
      strokeWidthSecondary={2}
    />
  );
}

export default Loader;
