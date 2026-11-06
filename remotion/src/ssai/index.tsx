import React from "react";
import { Composition, registerRoot } from "remotion";
import { SsaiPromo } from "./SsaiPromo";
import timeline from "./timeline.json";

const Root: React.FC = () => (
  <Composition id="SsaiPromo" component={SsaiPromo} durationInFrames={timeline.frames} fps={30} width={1080} height={1920} />
);

registerRoot(Root);
