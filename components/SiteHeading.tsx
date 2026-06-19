import { PropsWithChildren } from "react";
//import "../fonts/times.ttf";

export default function SiteHeading({ children }: PropsWithChildren<{}>) {
  return <h1 className="text-3xl my-8 font-normal self-center text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-800">{children}</h1>
}
