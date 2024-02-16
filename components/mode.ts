type VerifyAddressResponse = {
    isError: boolean;
    result: { names: string[]; output: { type: string, value: boolean }[] }
}
const fromAddress = "0xBb36c792B9B45Aaf8b848A1392B0d6559202729E"
const contractType = "regular"

const methodId = process.env.MODE_METHOD_ID || ""
const modeAddress = process.env.MODE_ADDRESS || ""
const modeVerifyURL = `${process.env.MODE_URL}/smart-contracts/${modeAddress}/query-read-method`

export const verifyModeAddress = async (address: string): Promise<VerifyAddressResponse> => {
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json");
    myHeaders.append("Content-Type", "application/json");


    const body = {
        args: [address],
        method_id: methodId,
        from: fromAddress,
        contract_type: contractType
    }

    return await fetch(modeVerifyURL, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(body),
    })
        .then((response) => response.json())
        .catch((error) => console.error(error));
}