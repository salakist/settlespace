import React from 'react';
import { Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Address } from '../../../shared/types';
import { insetSurfaceSx } from '../../../shared/theme/surfaceStyles';

interface PersonAddressEditorProps {
	addresses: Address[];
	onChange: (addresses: Address[]) => void;
	disabled?: boolean;
}

export const createEmptyAddress = (): Address => ({
	label: '',
	streetLine1: '',
	streetLine2: '',
	postalCode: '',
	city: '',
	stateOrRegion: '',
	country: '',
});

const addressKeys = new WeakMap<Address, string>();
let nextAddressKey = 0;

function getAddressKey(address: Address): string {
	const existingKey = addressKeys.get(address);
	if (existingKey) {
		return existingKey;
	}

	nextAddressKey += 1;
	const key = `address-${nextAddressKey}`;
	addressKeys.set(address, key);
	return key;
}

const PersonAddressEditor: React.FC<PersonAddressEditorProps> = ({ addresses, onChange, disabled = false }) => {
	const updateAddress = (index: number, field: keyof Address, value: string) => {
		const nextAddresses = [...addresses];
		nextAddresses[index] = {
			...nextAddresses[index],
			[field]: value,
		};

		onChange(nextAddresses);
	};

	const handleAddAddress = () => {
		onChange([...addresses, createEmptyAddress()]);
	};

	const handleRemoveAddress = (index: number) => {
		onChange(addresses.filter((_, currentIndex) => currentIndex !== index));
	};

	return (
		<Stack spacing={2}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', sm: 'center' }}
				spacing={1.5}
			>
				<div>
					<Typography variant="overline" color="primary.main">
						Addresses
					</Typography>
					<Typography variant="subtitle1">Contact and location details</Typography>
				</div>
				<Button variant="outlined" onClick={handleAddAddress} disabled={disabled}>
					Add Address
				</Button>
			</Stack>

			{addresses.length === 0 ? (
				<Paper elevation={0} sx={insetSurfaceSx}>
					<Typography color="text.secondary">No addresses added yet.</Typography>
				</Paper>
			) : (
				addresses.map((address, index) => (
					<Paper key={getAddressKey(address)} elevation={0} sx={insetSurfaceSx}>
						<Stack spacing={2}>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								justifyContent="space-between"
								alignItems={{ xs: 'flex-start', sm: 'center' }}
								spacing={1}
							>
								<div>
									<Typography variant="subtitle1">Address {index + 1}</Typography>
									<Typography variant="body2" color="text.secondary">
										Optional location details for this person.
									</Typography>
								</div>
								<IconButton
									aria-label={`remove address ${index + 1}`}
									onClick={() => handleRemoveAddress(index)}
									disabled={disabled}
									color="secondary"
								>
									<DeleteOutlineIcon />
								</IconButton>
							</Stack>
							<TextField
								label="Label"
								value={address.label}
								onChange={(event) => updateAddress(index, 'label', event.target.value)}
								fullWidth
							/>
							<TextField
								label="Street Line 1"
								value={address.streetLine1}
								onChange={(event) => updateAddress(index, 'streetLine1', event.target.value)}
								fullWidth
							/>
							<TextField
								label="Street Line 2"
								value={address.streetLine2 ?? ''}
								onChange={(event) => updateAddress(index, 'streetLine2', event.target.value)}
								fullWidth
							/>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<TextField
									label="Postal Code"
									value={address.postalCode}
									onChange={(event) => updateAddress(index, 'postalCode', event.target.value)}
									fullWidth
								/>
								<TextField
									label="City"
									value={address.city}
									onChange={(event) => updateAddress(index, 'city', event.target.value)}
									fullWidth
								/>
							</Stack>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<TextField
									label="State / Region"
									value={address.stateOrRegion ?? ''}
									onChange={(event) => updateAddress(index, 'stateOrRegion', event.target.value)}
									fullWidth
								/>
								<TextField
									label="Country"
									value={address.country}
									onChange={(event) => updateAddress(index, 'country', event.target.value)}
									fullWidth
								/>
							</Stack>
						</Stack>
					</Paper>
				))
			)}
		</Stack>
	);
};

export default PersonAddressEditor;