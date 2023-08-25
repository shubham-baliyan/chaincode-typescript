import { Object, Property } from "fabric-contract-api";

// this is a  Asset class which has the following Properties
// basically through the fabric gateway only ID and Value would be send with the appropriate method to perform
@Object()
export class Asset {
  @Property()
  public docType?: string;

  @Property()
  public ID: string;

  @Property()
  public Value: string;

  @Property()
  public Owner: string;
}
