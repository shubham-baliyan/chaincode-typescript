/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Asset } from "./asset";

@Info({
  title: "AssetTransfer",
  description: "Smart contract for Apache kafka",
})
export class AssetTransferContract extends Contract {
  // this function is to just init the ledger with the predifined asset
  @Transaction()
  public async InitLedger(context: Context): Promise<void> {
    const assets: Asset[] = [
      {
        ID: "101",
        Value: "I am organistation1 asset",
        Owner: "Org1",
      },
    ];

    for (const asset of assets) {
      // sending the docType as Asset
      asset.docType = "asset";
      // putting into the ledger
      await context.stub.putState(
        asset.ID,
        Buffer.from(stringify(sortKeysRecursive(asset)))
      );
      console.info(`Asset ${asset.ID} added to the intial Ledger`);
    }
  }

  // CreateAsset this functions creates a new asset with the provided details from the API  and is appended to the world State.
  @Transaction()
  public async CreateAsset(
    context: Context,
    id: string,
    value: string,
    owner: string
  ): Promise<void> {
    //always here the asset will be ceated by the organisations 1
    const ifAlreadyExists = await this.AssetExists(context, id);
    // checking if the asset with the same id exist already or not
    if (ifAlreadyExists) {
      throw new Error(`The asset with the ${id} already exists in the ledger`);
    }
    // if not present create the asset
    const asset = {
      ID: id,
      Value: value,
      Owner: owner,
    };
    //data inserting into the ledger in alphabetic order  using the sort keys Recursive function
    await context.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
  }

  // this function is used to get a asset from the world state with the given id
  // this function is not used in our application
  @Transaction(false)
  public async ReadAsset(context: Context, id: string): Promise<string> {
    const checkIfAssetExist = await context.stub.getState(id); // get the asset from chaincode state
    if (!checkIfAssetExist || checkIfAssetExist.length === 0) {
      throw new Error(
        `The asset  with the ${id} is not found or does not exist`
      );
    }
    // if exist just return
    return checkIfAssetExist.toString();
  }

  // updating the asset with provided id to a newOwner
  @Transaction()
  public async UpdateAsset(
    context: Context,
    id: string,
    value: string,
    owner: string
  ): Promise<void> {
    // check before adding whether the asset exists or not
    const checkIfExist = await this.AssetExists(context, id);
    if (!checkIfExist) {
      throw new Error(`The asset with the  ${id} does not exist`);
    }

    // updating the found asset with new values
    const updatedAsset = {
      ID: id,
      Value: value,
      Owner: owner,
    };
    return context.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
    );
  }

  // deleting the assets , id should be provided
  @Transaction()
  public async DeleteAsset(context: Context, id: string): Promise<void> {
    const checkIfAssetExist = await this.AssetExists(context, id);
    if (!checkIfAssetExist) {
      throw new Error(`The asset  does not exist`);
    }
    //otherwise delete
    return context.stub.deleteState(id);
  }

  // AssetExists is function used to return true or false  depending upon whether the asset exist or not in the world state.
  @Transaction(false)
  @Returns("boolean")
  public async AssetExists(context: Context, id: string): Promise<boolean> {
    const assetExistJson = await context.stub.getState(id);
    return assetExistJson && assetExistJson.length > 0;
  }

  // TransferAsset function is used the update the owner of the existing asset
  @Transaction()
  public async TransferAsset(
    context: Context,
    id: string,
    newOwner: string
  ): Promise<string> {
    const assetInString = await this.ReadAsset(context, id);
    const asset = JSON.parse(assetInString);
    const previousOwner = asset.Owner;
    // setting the newOwner recieved from the api
    asset.Owner = newOwner;
    await context.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
    return previousOwner;
  }

  // GetAllAssets function is used to get all the assets which are present on the worldState
  @Transaction(false)
  @Returns("string")
  public async GetAllAssets(context: Context): Promise<string> {
    // array to store all the assets
    const allAssets = [];
    // this query gets us all the assets
    const iterator = await context.stub.getStateByRange("", "");
    let response = await iterator.next();
    while (!response.done) {
      const strValue = Buffer.from(response.value.value.toString()).toString(
        "utf8"
      );
      let singleRecord;
      try {
        singleRecord = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        singleRecord = strValue;
      }
      allAssets.push(singleRecord);
      response = await iterator.next();
    }
    //stringify the result before its returned
    return JSON.stringify(allAssets);
  }
}
