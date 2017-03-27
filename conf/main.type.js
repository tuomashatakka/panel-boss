

type AtomPanelType = {
  item: Element,
  getItem: () => Element
};

type CoordType = [ number, number ];

type DimensionsType = {
  width:  number,
  height: number,
  delta:  CoordType
};

type StateType = {
  co:   CoordType | void,
  diff: CoordType | void,
  mutating: boolean | void
};
