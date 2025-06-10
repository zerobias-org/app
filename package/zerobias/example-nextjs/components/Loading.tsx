import Image from "next/image";

export const Loading = () => {
  return (
    <div className="relative flex justify-center items-center w-full m-16">
      <div className="absolute animate-spin rounded-full h-[350px] w-[350px] border-t-4 border-b-4 border-red-400"></div>
      <Image src="" overrideSrc="/images/logo.png" alt="" className=" h-[300px] w-[300px]" />
    </div>
  );
};
